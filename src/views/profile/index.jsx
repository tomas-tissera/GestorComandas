import { Link,Outlet, useLocation, useNavigate } from "react-router-dom";//carga el contenido debajo de profile de las otras rutas hijas
import styles from "./profile.module.css"
import { FaHome } from "react-icons/fa";

const Profile = () =>{
    const { pathname } = useLocation();
    const navigate= useNavigate();
    const hadleTabClick = (path) =>{
        navigate(`/profile/${path}`);
    };

    return(
        <div className={styles.homeContainer}>
            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>

                <span 
                    className={`${pathname.includes("my-info") ? styles.active:""} ${styles.tab}`} 
                    onClick = {()=>hadleTabClick("my-info")}
                    style={{ marginRight: 8 }}
                    >
                        Mi info
                </span>
                <span 
                    className={`${pathname.includes("liked-events") ? styles.active:""} ${styles.tab}`}
                    onClick = {()=>hadleTabClick("liked-events")}    
                    >
                        Eventos Favoritos
                </span>
                </div>
            <Link to="/" className={styles.homeLink}><FaHome className={styles.homeIcon}/></Link>
            </div>
            <Outlet/>
        </div>
    );
}
export default Profile;