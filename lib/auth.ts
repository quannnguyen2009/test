import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret_key_change_me")
const ALG = "HS256"

export async function sign(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET)
}

export async function verify(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET)
        return payload
    } catch (e) {
        return null
    }
}

export async function getSession() {
    const token = (await cookies()).get("token")?.value
    if (!token) return null
    return await verify(token)
}
