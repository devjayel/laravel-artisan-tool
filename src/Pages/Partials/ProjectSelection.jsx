import { useState, useEffect } from "react";
import Card from "@/Components/Card";

export default function ProjectSelection({ changePage }) {
    const [folderPath, setFolderPath] = useState('');
    const [isLaravel, setIsLaravel] = useState(false);
    const [project, setProject] = useState({
        name: '',
        folder: ''
    });
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState(''); // Add save status state

    useEffect(() => {
        loadSavedProject();
    }, []);

    const loadSavedProject = () => {
        try {
            const savedProject = localStorage.getItem('laravelProject');
            if (savedProject) {
                const parsedProject = JSON.parse(savedProject);
                setProject(parsedProject);
                setIsLaravel(true);
                setFolderPath(parsedProject.folder);
                changePage("workspace");
            }
        } catch (error) {
            console.error('Error loading saved project:', error);
        }
    };

    const selectFolder = async () => {
        try {
            setError('');
            const result = await window.electron.ipcRenderer.invoke('select:folder');
            if (result) {
                setFolderPath(result);
                const isValid = await window.electron.ipcRenderer.invoke('verify:laravel', result.folder);
                setIsLaravel(isValid);
                if (isValid) {
                    setProject(result);
                } else {
                    setError('Selected folder is not a valid Laravel project');
                    setProject({
                        name: '',
                        folder: ''
                    });
                }
            } else {
                setError('No folder selected');
                setIsLaravel(false);
                setProject({
                    name: '',
                    folder: ''
                });
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            setError('Failed to select folder: ' + error.message);
            setIsLaravel(false);
            setProject({});
        }
    };

    const handleSave = () => {
        try {
            setSaveStatus('saving');
            setError('');

            if (!isLaravel || !project.folder) {
                setError('Please select a valid Laravel project first');
                setSaveStatus('');
                return;
            }

            localStorage.setItem('laravelProject', JSON.stringify(project));
            setSaveStatus('saved');

            // Reset save status after 2 seconds
            setTimeout(() => {
                setSaveStatus('');
                changePage("workspace");
            }, 2000);
        } catch (error) {
            console.error('Error saving project:', error);
            setError('Failed to save project: ' + error.message);
            setSaveStatus('');
        }
    };

    return (
        <div className="space-y-5">
            <Card>
                <div className="p-4 border-b">
                    <h1 className="font-bold text-lg">Set Laravel Project Root Folder</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Choose the root directory of your Laravel project. This should be the folder containing the artisan file and composer.json.
                    </p>
                </div>
                <div className="p-4 space-y-4 flex flex-col">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                className={`w-1/2 border rounded p-3 ${error ? 'border-red-300' : isLaravel ? 'border-green-300' : ''}`}
                                type="text"
                                readOnly
                                value={project.folder}
                                placeholder="Laravel Project Root Folder"
                            />
                            <button
                                className="bg-orange-500 hover:bg-orange-600 transition-colors text-white p-3 rounded-md"
                                onClick={selectFolder}
                            >
                                Browse Folder
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                        {isLaravel && !error && (
                            <p className="text-green-500 text-sm">✓ Valid Laravel project detected</p>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!isLaravel || saveStatus === 'saving'}
                        className={`w-max ${isLaravel ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed'} transition-colors text-white p-3 rounded-md flex items-center gap-2`}
                    >
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save'}
                    </button>
                </div>
            </Card>
        </div>
    );
}