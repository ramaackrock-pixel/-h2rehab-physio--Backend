import jwt from 'jsonwebtoken'
import { Admin } from '../models/admin.model.js'
import { Staff } from '../models/staff.model.js'

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({ message: "Unauthorized request" })
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        let user = await Admin.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            user = await Staff.findById(decodedToken?._id).select("-password -refreshToken")
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid Access Token" })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({ message: error?.message || "Invalid access token" })
    }
}
