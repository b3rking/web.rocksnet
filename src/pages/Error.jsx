import { useRouteError } from "react-router"

const Error = () => {
    const error = useRouteError()
    console.log(error);
    
    return (
        <div className='text-4xl'>Error</div>
    )
}

export default Error