import { useApp } from "#hooks/useApp"

const Dashboard = () => {
    const app = useApp('Tableau de bord')
    return (
        <div>Dashboard</div>
    )
}

export default Dashboard