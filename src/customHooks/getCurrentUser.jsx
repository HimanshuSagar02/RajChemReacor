import { useEffect } from "react"
import { serverUrl } from "../App"
import axios from "axios"
import { useDispatch, useSelector } from "react-redux"
import { setUserData } from "../redux/userSlice"

const getCurrentUser = ()=>{
    let dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
   
    useEffect(()=>{
        // If userData already exists, don't fetch again (prevents unnecessary requests)
        if (userData) {
            console.log("[GetCurrentUser] User data already exists, skipping fetch");
            return;
        }
        
        const fetchUser = async () => {
            try {
                console.log("[GetCurrentUser] Fetching current user...");
                let result = await axios.get(serverUrl + "/api/user/currentuser", {
                    withCredentials: true,
                    timeout: 10000 // 10 second timeout
                });
                
                if (result.data && result.data._id) {
                    console.log("[GetCurrentUser] User fetched successfully:", result.data.email, result.data.role);
                    dispatch(setUserData(result.data));
                } else {
                    console.log("[GetCurrentUser] Invalid user data received");
                    dispatch(setUserData(null));
                }
            } catch (error) {
                console.error("[GetCurrentUser] Error fetching user:", error);
                if (error.response) {
                    console.error("[GetCurrentUser] Response status:", error.response.status);
                    console.error("[GetCurrentUser] Response data:", error.response.data);
                    
                    // If 401, clear user data (not authenticated)
                    if (error.response.status === 401) {
                        console.log("[GetCurrentUser] 401 Unauthorized - clearing user data");
                        dispatch(setUserData(null));
                    }
                } else if (error.request) {
                    console.error("[GetCurrentUser] No response received:", error.request);
                } else {
                    console.error("[GetCurrentUser] Error setting up request:", error.message);
                }
                dispatch(setUserData(null));
            }
        }
        
        // Small delay to ensure cookie is set after login
        const timer = setTimeout(() => {
            fetchUser();
        }, 100);
        
        return () => clearTimeout(timer);
    },[]) // Empty dependency array - only run once on mount
}

export default getCurrentUser