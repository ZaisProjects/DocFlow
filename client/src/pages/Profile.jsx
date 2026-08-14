import { useEffect, useState } from 'react'; 
import { Link } from 'react-router-dom';

import { getProfile } from '../services/userService'; 
import '../styles/profile.css'; 

export default function Profile() { 
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true); 
    
    useEffect(() => { 
        async function load() { 
            try { 
                const data = await getProfile(); 
                setUser(data); 
            } 
            catch (error) { 
                console.error(error); 
            } 
            finally { 
                setLoading(false); 
            } 
        } load(); }, []); 
        
        if (loading) {
            return ( 
                <div className="profile-page"> 
                    <p>Loading profile...</p> 
                </div> 
            ); 
        } 
        if (!user) { 
            return ( 
                <div className="profile-page"> 
                    <p>Failed to load profile.</p> 
                </div> 
            );
        } return ( 
        <div className="profile-page"> 
            <div className="profile-card">
                <div className="profile-avatar">
                    {user.name?.charAt(0).toUpperCase()}
                </div> 
                <h2>{user.name}</h2> 
                <p className="profile-email">{user.email}</p> 
                <div className="profile-info"> 
                    <div className="info-row"> 
                        <span>User ID</span> 
                        <strong>{user.userId}</strong> 
                    </div> 
                    <div className="info-row"> 
                        <span>Joined</span> 
                        <strong> 
                            {new Date(user.createdAt).toLocaleDateString()} 
                        </strong>
                    </div> 
                </div> 
                <Link to="/dashboard" className="back-btn"> 
                    ← Back to Dashboard 
                </Link> 
            </div> 
        </div> 
    ); 
}



