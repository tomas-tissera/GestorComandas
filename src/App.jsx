import Router from "./routes/index";
import './App.css'

function App() {
  return <Router/>
}

export default App






// import Navbar from './components/navbar/index'
// import './App.css'
// import Eventos from './components/events/index'
// const arrayOfNumbers = [1,2,3,4,5,6,7,8,9];
// const arrayOfPeapels = [{
//   "id":1,
//   "name":"juan",
//   "age":25,
// },{
//   "id":2,
//   "name":"luis",
//   "age":20,
// }];
// function App() {

//     const items = arrayOfNumbers.map((item)=> <li key={`array-number-item-${item}`}>{item}</li>);
//     console.log(items);
//     const personas = arrayOfPeapels.map((persona)=> <li key={`array-number-person-${persona.id}`}>{persona.id}:{persona.name}</li>);
//     console.log(personas);
//     // let items = [];
//   // for (const item of arrayOfNumbers){
//   //   items.push(<li>{item}</li>)
//   // }
//   return (
//     <>
//       <Eventos/>
//       <Navbar/>
//       <ul>
//         {items}
//       </ul>
//       <ul>
//         {personas}
//       </ul>
//     </>
//   )
// }

// export default App
