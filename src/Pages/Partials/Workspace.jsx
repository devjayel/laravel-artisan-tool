import Layout from "@/Layouts/DefaultLayout"
import Card from "@/Components/Card"
import ServerControls from "@/Components/ServerControls";
import { useState, useEffect } from "react"
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import styles

export default function Workspace({ artisanCommand, changePage }) {
    const [selectedCommand, setSelectedCommand] = useState({
        name: ''
    })
    const [isExecuting, setIsExecuting] = useState(false);
    const [name, setName] = useState('');
    const [isSelectedCommand, setIsSelectedCommand] = useState(false);
    const [commandFlags, setCommandFlags] = useState([]);
    const [isServing, setIsServing] = useState(false);


    const [project, setProject] = useState({
        'name': '',
        "folder": ""
    });
    const handleSelectCommand = (command) => {
        setSelectedCommand(command)
        setIsSelectedCommand(true)
        setCommandFlags(command.flags)
    }
    const handleToggleFlag = (index) => {
        const updatedFlags = [...commandFlags];
        updatedFlags[index].isEnabled = !updatedFlags[index].isEnabled;
        setCommandFlags(updatedFlags);
        if (selectedCommand) {
            setSelectedCommand({ ...selectedCommand, flags: updatedFlags });
        }
    };
    const handleInputChange = (index, value) => {
        const updatedFlags = [...commandFlags];
        updatedFlags[index].value = value;
        if (updatedFlags[index].value) {
            updatedFlags[index].hasError = false;
        }
        setCommandFlags(updatedFlags);
        if (selectedCommand) {
            setSelectedCommand({ ...selectedCommand, flags: updatedFlags });
        }
    };
    const handleChangeProject = () => {
        localStorage.removeItem('laravelProject');
        setProject({
            'name': '',
            "folder": ""
        });
        changePage("home");
    };
    useEffect(() => {
        loadSavedProject();
        const successHandler = (event, output) => {
            console.log('Command output:', output);
            setIsExecuting(false);
            toast.success('Command executed successfully!');
        };
        const errorHandler = (event, error) => {
            console.error('Command error:', error);
            setIsExecuting(false);
            toast.error(`Error: ${error}`);
        };

        window.electron.ipcRenderer.on('command-success', successHandler);
        window.electron.ipcRenderer.on('command-error', errorHandler);
    }, []);

    const loadSavedProject = () => {
        try {
            const savedProject = localStorage.getItem('laravelProject');
            if (savedProject) {
                const parsedProject = JSON.parse(savedProject);
                setProject(parsedProject);
            }
        } catch (error) {
            console.error('Error loading saved project:', error);
        }
    };
    const handleExecute = () => {
        setIsExecuting(true);
        let hasError = false;
        let flags = [];
        let commandToExecute = "";
        let commandName = "";
        let actualName = name;
        const updatedFlags = [...commandFlags].map((item) => {
            if (item.isEnabled && item.needs_value && !item.value) {
                item.hasError = true;
                hasError = true;
            } else {
                item.hasError = false;
            }
            return item;
        });

        setCommandFlags(updatedFlags);

        if (hasError) {
            toast.error('Please fill in all required values for enabled flags.');
            return;
        }

        //get all enabled flags
        updatedFlags.map((item) => {
            if (item.isEnabled) {
                if (item.needs_value) {
                    flags.push(`${item.command}=${item.value}`)
                } else {
                    flags.push(`${item.command}`)
                }
            }
        });

        if (selectedCommand.name === 'make:migration') {
            commandName = actualName.toLowerCase().replaceAll(' ', '_');
        } else {
            if (selectedCommand.needs_value) {
                commandName = selectedCommand.suffix ? actualName.replaceAll(' ', '_') + selectedCommand.suffix : actualName.replaceAll(' ', '_');
            } else {
                commandName = "";
            }
        }



        commandToExecute = `php artisan ${selectedCommand.name} ${commandName} ${flags.join(' ')}`

        console.log('Executing command with:', selectedCommand);
        console.log('Command flags:', commandFlags);
        console.log('Command name:', name);
        console.log('Command flags:', flags);
        console.log('Command to execute:', commandToExecute);
        toast.success('Executing artisan command');


        window.electron.ipcRenderer.send('execute:command', {
            artisan: commandToExecute,
            project
        });
    };
    const handleServe = () => {
        setIsServing(true);
        window.electron.ipcRenderer.send('execute:command', {
            artisan: 'php artisan serve',
            project
        });
        toast.info('Starting Laravel development server...');
    };
    const handleStopServe = () => {
        window.electron.ipcRenderer.send('execute:command', {
            artisan: 'taskkill /F /IM php.exe',
            project
        });
        setIsServing(false);
        toast.info('Stopping Laravel development server...');
    };

    return (
        <>
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-5">
                    <Card className="flex-1">
                        <div className="font-bold text-lg p-4  border-b">
                            Project
                        </div>
                        <div className="p-4 space-y-5">
                            <div>
                                <b>Name</b>
                                <p>{project.name.replaceAll("\"", "")}</p>
                            </div>
                            <div>
                                <b>Path</b>
                                <p>{project.folder}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="bg-orange-500 text-white px-4 py-2 rounded-md"
                                    onClick={handleChangeProject}
                                >
                                    Change Project
                                </button>
                            </div>
                        </div>
                    </Card>
                    <Card className="flex-1">
                        <ServerControls project={project} />
                    </Card>
                </div>


                <Card>
                    <div className="font-bold text-lg p-4  border-b">
                        Name
                    </div>
                    <div className="p-4">
                        <input
                            className="w-full border rounded p-3"
                            type="text"
                            placeholder="eg: Product"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </Card>
                <Card>
                    <div className="font-bold text-lg p-4  border-b">
                        Commands
                    </div>
                    <div className="space-y-5 p-4">
                        {artisanCommand.map((item, index) => (
                            <div key={index} className="space-y-3">
                                <b className="uppercase">{item.name}</b>
                                <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {item.commands.map((item, index) => (
                                        <button className={"text-white px-4 py-2 rounded-md " + (selectedCommand.name === item.name ? "bg-orange-500" : "bg-slate-300")} onClick={() => handleSelectCommand(item)}>
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <div className="font-bold text-lg p-4  border-b">
                        Flags
                    </div>
                    <div className="p-4">
                        {isSelectedCommand === false && (
                            <div>
                                No command selected
                            </div>
                        )}
                        {isSelectedCommand === true && (
                            <div className="flex flex-col gap-2">
                                {commandFlags.map((item, index) => (
                                    <div key={index} className="flex gap-5 items-center">
                                        <button
                                            className={"w-[100px] text-white px-4 py-2 rounded-md " + (item.isEnabled ? 'bg-orange-500' : 'bg-slate-300')}
                                            onClick={() => handleToggleFlag(index)}
                                        >
                                            {item.isEnabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 text-md font-bold">{item.command}</span>
                                            <span className="text-slate-600">{item.description}</span>
                                        </div>

                                        {/* Conditionally render the input field if the flag is enabled and needs a value */}
                                        {item.isEnabled && item.needs_value && (
                                            <input
                                                type="text"
                                                className={`border-2 p-3 rounded-lg focus:outline-none ${item.hasError ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder={item.placeholder || 'Enter value'}
                                                value={item.value || ''}  // Bind the value of the input to the flag's value
                                                onChange={(e) => handleInputChange(index, e.target.value)}  // Capture input changes
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
                <Card className="p-4">
                    <button
                        className={`text-white px-4 py-2 rounded-md ${isExecuting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500'}`}
                        onClick={handleExecute}
                        disabled={isExecuting}
                    >
                        {isExecuting ? 'Executing...' : 'Execute'}
                    </button>
                </Card>
            </div>
            <ToastContainer />
        </>
    )
}