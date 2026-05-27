import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useDispatch } from "react-redux"
import { authenticate } from "@/features/auth/authSlice"
import { useNavigate } from "react-router"
import { useState } from "react"

export function Login({ className, ...props }) {

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            await dispatch(authenticate({ email, password })).unwrap()
            navigate("/")
        } catch (err) {
            setError(err?.message || "Login failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Se connecter dans votre compte</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin}>
                                {error && <div className="mb-4 p-3 bg-red-50 text-red-800 rounded text-sm">{error}</div>}
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                            disabled={isLoading}
                                        />
                                    </Field>
                                    <Field>
                                        <div className="flex items-center">
                                            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                                        </div>
                                        <Input id="password" type="password" required disabled={isLoading} />
                                    </Field>
                                    <Field>
                                        <Button type="submit" disabled={isLoading}>{isLoading ? "connexion..." : "Se connecter"}</Button>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
