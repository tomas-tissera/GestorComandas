import { createRoot } from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Home from "../views/home";
import Detail from "../views/detail";
import Error404 from "../views/error 404";
import Profile from "../views/profile";
import LikedEvents from "../views/profile/components/LikedEvents";
import MyInfo from "../views/profile/components/MyInfo";
const router = createBrowserRouter([{
    path:"/",
    element: <Home/>,
    errorElement: <Error404/>
},{
    path:"/detail/:eventId",
    element: <Detail/>
},{
    path:"/profile",
    element: <Profile/>,
    children:[
        {
            path:"my-info",
            element: <MyInfo/>
        },{
            path:"liked-events",
            element: <LikedEvents/>
        }
    ]
}
]);
const MyRoutes = () =><RouterProvider router={router}/>;

export default MyRoutes;