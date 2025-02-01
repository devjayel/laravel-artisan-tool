import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Card from "@/Components/Card";

export default function ServerControls({ project }) {
    const [isLaravelServing, setIsLaravelServing] = useState(false);
    const [isReactRunning, setIsReactRunning] = useState(false);

    useEffect(() => {
        // Laravel server listeners
        const serverOutput = (event, data) => {
            console.log('Laravel Server output:', data);
            if (data.includes('Server running on')) {
                toast.success('Laravel server started successfully!');
            }
        };

        const serverError = (event, data) => {
            console.error('Laravel Server error:', data);
            toast.error('Laravel Server error: ' + data);
        };

        const serverStopped = () => {
            setIsLaravelServing(false);
            toast.info('Laravel Server stopped');
        };

        // React server listeners
        const reactOutput = (event, data) => {
            console.log('React output:', data);
            if (data.includes('VITE')) {
                toast.success('React server started successfully!');
            }
        };

        const reactError = (event, data) => {
            console.error('React error:', data);
            toast.error('React error: ' + data);
        };

        const reactStopped = () => {
            setIsReactRunning(false);
            toast.info('React server stopped');
        };

        // Add event listeners
        window.electron.ipcRenderer.on('server-output', serverOutput);
        window.electron.ipcRenderer.on('server-error', serverError);
        window.electron.ipcRenderer.on('server-stopped', serverStopped);
        window.electron.ipcRenderer.on('react-output', reactOutput);
        window.electron.ipcRenderer.on('react-error', reactError);
        window.electron.ipcRenderer.on('react-stopped', reactStopped);

        // Cleanup
        return () => {
            window.electron.ipcRenderer.removeListener('server-output', serverOutput);
            window.electron.ipcRenderer.removeListener('server-error', serverError);
            window.electron.ipcRenderer.removeListener('server-stopped', serverStopped);
            window.electron.ipcRenderer.removeListener('react-output', reactOutput);
            window.electron.ipcRenderer.removeListener('react-error', reactError);
            window.electron.ipcRenderer.removeListener('react-stopped', reactStopped);
        };
    }, []);

    const handleStartLaravel = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('start:server', {
                project
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            setIsLaravelServing(true);
            toast.info('Starting Laravel development server...');
        } catch (error) {
            toast.error('Failed to start Laravel server: ' + error.message);
        }
    };

    const handleStopLaravel = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('stop:server');

            if (result.error) {
                toast.error(result.error);
                return;
            }

            setIsLaravelServing(false);
            toast.info('Stopping Laravel development server...');
        } catch (error) {
            toast.error('Failed to stop Laravel server: ' + error.message);
        }
    };

    const handleStartReact = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('start:react', {
                project
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            setIsReactRunning(true);
            toast.info('Starting React development server...');
        } catch (error) {
            toast.error('Failed to start React server: ' + error.message);
        }
    };

    const handleStopReact = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('stop:react');

            if (result.error) {
                toast.error(result.error);
                return;
            }

            setIsReactRunning(false);
            toast.info('Stopping React development server...');
        } catch (error) {
            toast.error('Failed to stop React server: ' + error.message);
        }
    };

    return (
        <>
            <div className="font-bold text-lg p-4 border-b">
                Development Servers
            </div>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Laravel Server</h3>
                        <p className="text-sm text-gray-600">
                            Status: <span className={`font-medium ${isLaravelServing ? 'text-green-600' : 'text-gray-600'}`}>
                                {isLaravelServing ? 'Running' : 'Stopped'}
                            </span>
                        </p>
                    </div>
                    <button
                        className={`px-4 py-2 rounded-md text-white ${isLaravelServing
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'
                            }`}
                        onClick={isLaravelServing ? handleStopLaravel : handleStartLaravel}
                    >
                        {isLaravelServing ? 'Stop Server' : 'Start Server'}
                    </button>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">React Server</h3>
                            <p className="text-sm text-gray-600">
                                Status: <span className={`font-medium ${isReactRunning ? 'text-green-600' : 'text-gray-600'}`}>
                                    {isReactRunning ? 'Running' : 'Stopped'}
                                </span>
                            </p>
                        </div>
                        <button
                            className={`px-4 py-2 rounded-md text-white ${isReactRunning
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                                }`}
                            onClick={isReactRunning ? handleStopReact : handleStartReact}
                        >
                            {isReactRunning ? 'Stop Server' : 'Start Server'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}