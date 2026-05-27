import { useRouteError } from "react-router"

const ErrorCard = ({ error, statusCode }) => {
    return <>
        <div className='flex items-center justify-center mt-48'>
            Erreur ({statusCode}) - {error}
        </div>
    </>
}
const Error = () => {
    const error = useRouteError()
    console.log(error)

    if (error.status === 404) {
        return <ErrorCard statusCode="404" error="La page rechercher n'est pas disponible!" />
    }

    return (
        <ErrorCard statusCode={error.status} error="Un probleme est survenu, Nous excusons pour la l'interuption"/>
    )
}

export default Error