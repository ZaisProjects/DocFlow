export const getProfile = async (req, res) => { 
    try { 
    // req.user comes from authMiddleware after JWT verification 
        res.json({
                userId: req.user.userId, 
                name: req.user.name, 
                email: req.user.email, 
                createdAt: req.user.createdAt || new Date(), 
            }); 
        } 
        catch (error) { 
            res.status(500).json({ 
                message: 'Failed to load profile', 
        }); 
    } 
};