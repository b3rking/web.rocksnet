import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "#components/ui/dialog"

export const Modal = ({ trigger, children, isOpen, onOpenChange }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                {children}
            </DialogContent>
        </Dialog>
    )
}