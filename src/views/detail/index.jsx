import { useEffect , useState} from 'react';
import {useParams} from 'react-router-dom';
import {format} from "date-fns";
import useEventsResults from '../../states/events-results';
import styles from "./detail.module.css";

const Detail = () =>{ 
    const {data} = useEventsResults();
    const {eventId} = useParams();
    const [eventData , setEventData] =  useState({});
    const [error , setError] =  useState({});
    const [isLoading, setIsLoading] = useState(true)
    console.log(data);
    useEffect(()=>{
        const fetchEventsData = async() => {
            try{
                
                const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events/${eventId}?apikey=${import.meta.env.VITE_TICKETMASTER_API_KEY}`);
                const data = await response.json();
            
                setEventData(data);
                setIsLoading(false);
            } catch (error){
                setError(error);
                setIsLoading(false);
            }
        };
        fetchEventsData();
    },[]);
    console.log(eventData);
    if (isLoading && Object.keys(eventData) === 0) {
        return<div>Cargando...</div>
    }
    if (Object.keys(error) > 0) {
        return <div>error</div>
    }
    return(
        <div className={styles.container}>
            <div className={styles.mainInfoContainer}>
                <img src={eventData.images?.[0].url} className={styles.eventImage} alt={eventData.name} />
                <h4 className={styles.eventName}>{eventData.name}</h4>
                <p className={styles.infoParagraph}>{eventData.info}</p>
                <p>{eventData.dates?.start.localDate}</p>
            </div>
            <div className={styles.seatInfoContainer}>
                <h6 className={styles.seatMapTitle}>Mapa del evento</h6>
                <img src={eventData.seatmap?.staticUrl} alt="Seatmap event" />
                <p className={styles.pleaseNoteLegend}>{eventData.pleaseNote}</p>
                <p className={styles.priceRangeLegend}>Rango de precios: {eventData.priceRanges?.[0].min}-{eventData.priceRanges?.[0].max} {eventData.priceRanges?.[0].currency}</p>
            </div>
            <a href={eventData.url}>
                Ir por tus boletos
            </a>
        </div>
        // <div className={styles.container}>
        //     <div >
        //         <img src={eventData.images?.[0].url} className={styles.eventImage} alt={eventData.name} />
        //         <h4 className={styles.eventName}>{eventData.name}</h4>
        //         <p className={styles.infoParagraph}>{eventData.info}</p>
        //         
        //     </div>
            
        // </div>
    );
}
export default Detail;