export default function Card({ children, className = '' }) {
    return (
        <div className={"border bg-white rounded " + className}>
            {children}
        </div>
    )
}