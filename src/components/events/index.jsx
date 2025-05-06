import { useNavigate } from 'react-router-dom';
import EventosItems from './components/eventItem/index'
import { memo } from 'react';
// import data from '../../data/events.json'
// const events = data._embedded.events; !pasamos de usar estas lineas por const {events} = useEventsData();
const Eventos = ({searchTerm, events}) => {
    const navigate = useNavigate();

    
    const handleEventItemClick = (id) => {
        navigate(`/detail/${id}`);
    }

    const renderEvents =  () =>{
        let eventsFiltered = events;
        if(searchTerm.length > 0){
            eventsFiltered = eventsFiltered.filter((item) => item.name.toLocaleLowerCase().includes(searchTerm));

        }
        return eventsFiltered.map((eventsItems)=> (
            <EventosItems 
                key={`event-item-${eventsItems.id}`}
                name={eventsItems.name}
                info={eventsItems.info}
                image={eventsItems.images[0].url}
                onEventClick={handleEventItemClick}
                id={eventsItems.id}
            />
        ));
    };
    
    return(
        <div>
            <h2>
                -Eventos-
            </h2>
            {renderEvents()}
        </div>
    );
}

export default memo(Eventos);