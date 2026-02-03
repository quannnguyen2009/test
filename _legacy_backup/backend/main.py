from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os
import shutil
import uuid

# ---------------- CONFIG ----------------

DATABASE_URL = "sqlite:///./dev.db"
SECRET_KEY = "dev-secret"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MIN = 60 * 24 * 7 # 7 days

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ---------------- MODELS ----------------

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    hashed_password = Column(String)
    avatar = Column(String, nullable=True)

class Competition(Base):
    __tablename__ = "competitions"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    subtitle = Column(String)
    
    # Files
    description_path = Column(String, nullable=True)
    data_dir = Column(String, nullable=True) # Directory containing all data files
    data_dir = Column(String, nullable=True) # Directory containing all data files
    data_description_path = Column(String, nullable=True)
    ground_truth_path = Column(String, nullable=True) # Hidden from participants
    
    timeline = Column(String, default="")
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    metric = Column(String, default="rmse")
    submission_limit = Column(Integer, default=5)
    
    host_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    file_path = Column(String)
    score = Column(Float, nullable=True)
    status = Column(String, default="pending") # pending, graded, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

Base.metadata.create_all(bind=engine)

# ---------------- HELPERS ----------------

def db():
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()

def hash_pw(p): return pwd.hash(p)
def verify_pw(p, h): return pwd.verify(p, h)

def make_token(uid: int):
    return jwt.encode(
        {"sub": str(uid), "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MIN)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def current_user(token: str = Depends(oauth2), s: Session = Depends(db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = int(payload.get("sub"))
        user = s.get(User, uid)
        if not user: raise
        return user
    except:
        raise HTTPException(401, "Invalid token")

def save_file(file: UploadFile, folders: str) -> str:
    path = f"media/{folders}"
    os.makedirs(path, exist_ok=True)
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    full_path = f"{path}/{filename}"
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return full_path

def save_files(files: list[UploadFile], directory: str):
    os.makedirs(directory, exist_ok=True)
    for file in files:
        if not file.filename: continue
        path = f"{directory}/{file.filename}"
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

# ---------------- APP ----------------

app = FastAPI(title="AI Judge API")

# Serve media files
app.mount("/media", StaticFiles(directory="media"), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- AUTH ----------------

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str

@app.post("/auth/register")
def register(req: RegisterRequest, s: Session = Depends(db)):
    if s.query(User).filter_by(email=req.email).first():
        raise HTTPException(400, "Email exists")
    u = User(email=req.email, name=req.name, hashed_password=hash_pw(req.password))
    s.add(u); s.commit()
    return {"ok": True}

@app.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), s: Session = Depends(db)):
    u = s.query(User).filter_by(email=form.username).first()
    if not u or not verify_pw(form.password, u.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return {"access_token": make_token(u.id), "token_type": "bearer"}

@app.get("/auth/me")
def me(user: User = Depends(current_user)):
    return user

# ---------------- COMPETITIONS ----------------

@app.get("/competitions")
def list_comps(s: Session = Depends(db)):
    return s.query(Competition).order_by(Competition.created_at.desc()).all()

@app.get("/competitions/my")
def my_managed_comps(user: User = Depends(current_user), s: Session = Depends(db)):
    return s.query(Competition).filter_by(host_id=user.id).order_by(Competition.created_at.desc()).all()

@app.post("/competitions")
def create_comp(
    title: str = Form(...),
    subtitle: str = Form(...),
    metric: str = Form("rmse"),
    submission_limit: int = Form(5),
    timeline: str = Form(""),
    start_date: str = Form(None),
    end_date: str = Form(None),
    description_file: UploadFile = File(None),
    data_files: list[UploadFile] = File(None),
    data_desc_file: UploadFile = File(None),
    user: User = Depends(current_user),
    s: Session = Depends(db)
):
    # Unique ID for storage
    cid_str = str(uuid.uuid4())
    base_path = f"media/competitions/{cid_str}"
    
    desc_path = None
    if description_file and description_file.filename:
        desc_path = f"{base_path}/description/{description_file.filename}"
        os.makedirs(os.path.dirname(desc_path), exist_ok=True)
        with open(desc_path, "wb") as f:
            shutil.copyfileobj(description_file.file, f)
            
    data_dir = f"{base_path}/data"
    if data_files:
        save_files(data_files, data_dir)
        
    data_desc_path = None
    if data_desc_file and data_desc_file.filename:
        data_desc_path = f"{base_path}/data_desc/{data_desc_file.filename}"
        os.makedirs(os.path.dirname(data_desc_path), exist_ok=True)
        with open(data_desc_path, "wb") as f:
            shutil.copyfileobj(data_desc_file.file, f)

    gt_path = None
    if ground_truth_file and ground_truth_file.filename:
        gt_path = f"{base_path}/hidden/{ground_truth_file.filename}"
        os.makedirs(os.path.dirname(gt_path), exist_ok=True)
        with open(gt_path, "wb") as f:
            shutil.copyfileobj(ground_truth_file.file, f)

    c = Competition(
        title=title,
        subtitle=subtitle,
        metric=metric,
        submission_limit=submission_limit,
        timeline=timeline,
        start_date=datetime.fromisoformat(start_date) if start_date else None,
        end_date=datetime.fromisoformat(end_date) if end_date else None,
        description_path=desc_path,
        data_dir=data_dir,

        data_description_path=data_desc_path,
        ground_truth_path=gt_path,
        host_id=user.id
    )
    s.add(c); s.commit()
    return c

@app.put("/competitions/{cid}")
def update_comp(
    cid: int,
    title: str = Form(None),
    subtitle: str = Form(None),
    metric: str = Form(None),
    submission_limit: int = Form(None),
    timeline: str = Form(None),
    start_date: str = Form(None),
    end_date: str = Form(None),
    description_file: UploadFile = File(None),
    data_files: list[UploadFile] = File(None),
    data_desc_file: UploadFile = File(None),
    user: User = Depends(current_user),
    s: Session = Depends(db)
):
    c = s.get(Competition, cid)
    if not c: raise HTTPException(404)
    if c.host_id != user.id: raise HTTPException(403, "Not host")
    
    if title: c.title = title
    if subtitle: c.subtitle = subtitle
    if metric: c.metric = metric
    if submission_limit: c.submission_limit = submission_limit
    if timeline: c.timeline = timeline
    if start_date: c.start_date = datetime.fromisoformat(start_date)
    if end_date: c.end_date = datetime.fromisoformat(end_date)
    
    # Files are stored relative to existing structure if possible, or new
    # We can infer base path from existing or make new if needed.
    # Simple strategy: Use existing data_dir parent or create new.
    # For now, let's assume we maintain the structure if it exists.
    
    base_path = f"media/competitions/{c.id}_update_{uuid.uuid4().hex[:6]}" # simplistic
    if c.data_dir:
        base_path = os.path.dirname(c.data_dir)
        
    if description_file and description_file.filename:
        path = f"{base_path}/description/{description_file.filename}"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f: shutil.copyfileobj(description_file.file, f)
        c.description_path = path

    if data_files:
        path = f"{base_path}/data"
        save_files(data_files, path)
        c.data_dir = path

    if data_desc_file and data_desc_file.filename:
        path = f"{base_path}/data_desc/{data_desc_file.filename}"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f: shutil.copyfileobj(data_desc_file.file, f)
        c.data_description_path = path

    if ground_truth_file and ground_truth_file.filename:
        path = f"{base_path}/hidden/{ground_truth_file.filename}"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f: shutil.copyfileobj(ground_truth_file.file, f)
        c.ground_truth_path = path
        
    s.commit()
    return c

@app.delete("/competitions/{cid}")
def delete_comp(cid: int, user: User = Depends(current_user), s: Session = Depends(db)):
    c = s.get(Competition, cid)
    if not c: raise HTTPException(404)
    if c.host_id != user.id: raise HTTPException(403, "Not host")

    # Delete submissions
    s.query(Submission).filter_by(competition_id=cid).delete()

    # Delete files if they exist (rough clean up)
    if c.data_dir:
        parent = os.path.dirname(c.data_dir)
        if os.path.exists(parent):
            shutil.rmtree(parent, ignore_errors=True)

    s.delete(c)
    s.commit()
    return {"ok": True}

@app.get("/competitions/{cid}")
def get_comp(cid: int, s: Session = Depends(db)):
    c = s.get(Competition, cid)
    if not c: raise HTTPException(404)
    # Get host name
    host = s.get(User, c.host_id)
    return {"competition": c, "host": host.name if host else "Unknown", "is_host": False} # is_host calculated on front

@app.get("/competitions/{cid}/files")
def get_comp_files(cid: int, s: Session = Depends(db)):
    c = s.get(Competition, cid)
    if not c or not c.data_dir or not os.path.exists(c.data_dir):
        return []
    
    files = []
    for f in os.listdir(c.data_dir):
        if not f.startswith("."):
            files.append({"name": f, "path": f"{c.data_dir}/{f}"})
    return files

# ---------------- SUBMISSIONS ----------------

@app.post("/competitions/{cid}/submit")
def submit(
    cid: int,
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    s: Session = Depends(db)
):
    # Check limit? (Skip for now)
    
    path = save_file(file, "submissions")
    
    # Mock scoring
    import random
    score = round(random.uniform(0.5, 1.0), 4)

    sub = Submission(
        competition_id=cid,
        user_id=user.id,
        file_path=path,
        score=score,
        status="graded"
    )
    s.add(sub); s.commit()
    return {"ok": True, "score": score}

@app.get("/competitions/{cid}/leaderboard")
def leaderboard(cid: int, s: Session = Depends(db)):
    subs = s.query(Submission).filter_by(competition_id=cid).order_by(Submission.score.desc()).all()
    # Join with user to get names
    res = []
    for sub in subs:
        res.append({
            "id": sub.id,
            "user": sub.user.name,
            "score": sub.score,
            "created_at": sub.created_at
        })
    return res

@app.get("/competitions/{cid}/my_submissions")
def my_submissions(cid: int, user: User = Depends(current_user), s: Session = Depends(db)):
    return s.query(Submission).filter_by(competition_id=cid, user_id=user.id).order_by(Submission.created_at.desc()).all()