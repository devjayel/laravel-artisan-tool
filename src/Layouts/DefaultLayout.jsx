import Favicon from "@/Assets/favicon.ico"

export default function DefaultLayout({ children }) {
    return (
        <div className="app min-h-screen bg-slate-100">
            <div className="p-4 border-b bg-white">
                <div className="flex gap-3 items-center">
                    <img src={Favicon} className="w-12" />
                    <h1 className="font-bold">
                        Laravel Artisan Tool
                    </h1>
                </div>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    )
}