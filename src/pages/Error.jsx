import { Link, useRouteError } from "react-router"

const ErrorCard = ({ error }) => {
    return <>
        <div className='flex flex-col items-center justify-center mt-48'>
            <p>Erreur - {error}</p>
            <p>Veuillez reesayez plus tard.</p>
            <Link to="/" className="my-8 bg-amber-200 text-amber-900 py-1 px-4">Retour au dashboard</Link>
        </div>
    </>
}
const Error = () => {
    const error = useRouteError()
    console.log(error)

    if (error.status === 404) {
        return <ErrorCard error="La page rechercher n'est pas disponible!" />
    }

    return (
        <ErrorCard error="Un probleme est survenu lors du traitement de votre requete."/>
    )
}

export default Error