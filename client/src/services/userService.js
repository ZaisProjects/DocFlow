import api from '../api/axios'; 
export const getProfile = async () => { 
    const res = await api.get('/users/me'); 
    return res.data; 
};