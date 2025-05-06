import { useForm} from "react-hook-form"

const SingupForm = () => {
    const{register,handleSubmit, reset, formState:{errors}} = useForm();
    const handleSubmitClick = (data) => {
        console.log(data);
    };
    const handleClearClick = () => {
       reset(); 
    };
    console.log(errors);
    // const [name, setName] = useState('');
    // const [age, setAge] = useState('');
    // const [address, setAddress] = useState('');
    // const [zipcode, setZipcode] = useState('');
    // const [phone, setPhone] = useState('');
    // const handleClearClick = () => {
    //     setName("");
    //     setAge("");
    //     setAddress("");
    //     setZipcode("");
    //     setPhone("");
    // };
    // const handleSubmitClick = (evt) => {
    //     evt.preventDefault();
    //     console.log("submit:", {
    //         name,
    //         age,
    //         zipcode,
    //         phone,
    //         address
    //     });
    // };
    return (
        <form onSubmit={handleSubmit(handleSubmitClick)}>
            <label>Name:<input {...register("name",{required:true})}  /></label><br />
            <label>Age:<input {...register("age",{required:true})}/></label><br />
            <label>Address:<input {...register("address",{required:true})}/></label><br />
            <label>Zipcode:<input {...register("zipcode",{required:true})}/></label><br />
            <label>Phone:<input {...register("phone,{required:true}")}/></label><br />
            <div>
                <button onClick={handleClearClick} type="button">Clear</button>
                <button type="submit">Submit</button>
            </div>
        </form>
    );
}

export default SingupForm;