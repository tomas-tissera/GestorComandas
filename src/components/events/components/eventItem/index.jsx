// import { Link } from "react-router-dom";
import useLikeEvents from "../../../../hooks/useLikeEvents"
import "../eventItem/styles.css"
import HearthFilled from "../../../../assets/hearth-filled.png"
import HearthUnfilled from "../../../../assets/hearth-unfilled.png"
// import styles from "./eventItem.module.css"; //crea nombres especificos que no se repiten para las clases
// console.log(styles);
const EventosItem = ({info, id, name, image, onEventClick}) => {
    const{isEventLiked,toggleEventLike} = useLikeEvents(id)
    const handleSeeMoreClick = (evt)=>{ 
        evt.stopPropagation();//detiene la propagacion con el onclick del padre
        onEventClick(id);
        }
    const handHeartClick = () => {
        toggleEventLike();
    }
    return(
        <div onClick={()=> console.log("padre clickeado")} className="eventItem-container">
            <div className="imageContainer">
                <img src={isEventLiked ? HearthFilled : HearthUnfilled } alt="hearth button" className="hearthFilled" onClick={handHeartClick}/>
                <img src={image} alt={name} width={200} height={200}/>
            </div>
            <div className="evenInfo-container">
                <h4 className="event-name">{name}</h4>
                <p className="event-info">{info}</p>
                <button onClick={handleSeeMoreClick} className="see-more-btn">
                    Ver mas
                    {/* <Link to={` /detail/${id}`}>
                    </Link> */}
                </button>
            </div>
        </div>
    );
}

export default EventosItem;