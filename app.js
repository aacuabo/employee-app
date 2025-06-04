import React, { useState, useEffect, useCallback } from 'react';

// Main App component
const App = () => {
    // State for global template inputs
    const [templateData, setTemplateData] = useState({
        date: '',
        destination: '',
        purpose: '',
        duration: ''
    });

    // State for employee data (including checked status)
    const [employees, setEmployees] = useState(() => {
        // Initial mock employee data
        const initialEmployees = [];
        for (let i = 1; i <= 10; i++) {
            initialEmployees.push({
                id: `EMP${100 + i}`,
                name: `Employee Name ${i}`,
                position: `Position ${i}`,
                isChecked: false
            });
        }
        return initialEmployees;
    });

    // State for logged data (mimics DATA sheet)
    const [loggedData, setLoggedData] = useState([]);

    // State for print preview data (mimics EP sheet)
    const [printPreviewData, setPrintPreviewData] = useState({
        employee1: null,
        employee2: null,
        currentPage: 0,
        totalPages: 0
    });

    // State for managing custom modal visibility and content
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        showCancel: false
    });

    // State to manage the interactive processing flow
    const [interactiveProcessingState, setInteractiveProcessingState] = useState({
        isActive: false,
        checkedEmployees: [],
        currentPairIndex: 0
    });

    // Utility function to show a custom modal
    const showModal = useCallback((title, message, onConfirm = null, onCancel = null, showCancel = false) => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            onCancel,
            showCancel
        });
    }, []);

    // Utility function to close the custom modal
    const closeModal = useCallback(() => {
        setModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Function to handle changes in template input fields
    const handleTemplateChange = (e) => {
        const { name, value } = e.target;
        setTemplateData(prev => ({ ...prev, [name]: value }));
    };

    // Function to toggle individual employee checkbox
    const handleEmployeeCheck = (id) => {
        setEmployees(prev =>
            prev.map(emp =>
                emp.id === id ? { ...emp, isChecked: !emp.isChecked } : emp
            )
        );
    };

    // Function to uncheck all employee checkboxes
    const uncheckAllBoxes = useCallback(() => {
        setEmployees(prev => prev.map(emp => ({ ...emp, isChecked: false })));
        showModal('Success', 'All checkboxes have been unchecked.');
    }, [showModal]);

    // Function to clear the print preview template
    const clearPrintTemplate = useCallback(() => {
        setPrintPreviewData({
            employee1: null,
            employee2: null,
            currentPage: 0,
            totalPages: 0
        });
    }, []);

    // Function to populate the print preview for a given pair
    const populateTemplateForPair = useCallback((checkedEmps, pairIndex) => {
        const firstEmpIndex = pairIndex * 2; // 0-indexed
        const secondEmpIndex = firstEmpIndex + 1;

        const emp1 = checkedEmps[firstEmpIndex] ? { ...checkedEmps[firstEmpIndex], ...templateData } : null;
        const emp2 = checkedEmps[secondEmpIndex] ? { ...checkedEmps[secondEmpIndex], ...templateData } : null;

        setPrintPreviewData({
            employee1: emp1,
            employee2: emp2,
            currentPage: pairIndex + 1,
            totalPages: Math.ceil(checkedEmps.length / 2)
        });
    }, [templateData]);

    // Function to log data to the "DATA" sheet simulation
    const logDataToSheet = useCallback((employeesToLog) => {
        const newLogEntries = employeesToLog.map(emp => ({ ...emp, ...templateData }));
        setLoggedData(prev => [...prev, ...newLogEntries]);
    }, [templateData]);

    // Main interactive processing logic
    const processCheckedEmployeesInteractive = useCallback(() => {
        const checkedEmps = employees.filter(emp => emp.isChecked && emp.name.trim() !== '');

        if (checkedEmps.length === 0) {
            showModal('No Selection', 'No employees were selected. Please check at least one checkbox.', null, null, false);
            return;
        }

        const totalPairs = Math.ceil(checkedEmps.length / 2);

        // Show summary modal
        const summaryMessage = `Selected employees: ${checkedEmps.length}\nPages to process: ${totalPairs}\n\nTemplate Info:\nDate: ${templateData.date}\nDestination: ${templateData.destination}\nPurpose: ${templateData.purpose}\nDuration: ${templateData.duration}\n\nYou will be prompted to confirm each page.`;

        showModal('Processing Summary', summaryMessage, () => {
            closeModal();
            setInteractiveProcessingState({
                isActive: true,
                checkedEmployees: checkedEmps,
                currentPairIndex: 0
            });
            clearPrintTemplate(); // Clear template before starting
        }, null, false); // No cancel button for summary
    }, [employees, templateData, showModal, closeModal, clearPrintTemplate]);

    // Effect to handle the interactive processing flow step-by-step
    useEffect(() => {
        const { isActive, checkedEmployees, currentPairIndex } = interactiveProcessingState;

        if (isActive && checkedEmployees.length > 0) {
            const totalPairs = Math.ceil(checkedEmployees.length / 2);

            if (currentPairIndex < totalPairs) {
                populateTemplateForPair(checkedEmployees, currentPairIndex);

                const firstEmp = checkedEmployees[currentPairIndex * 2];
                const secondEmp = checkedEmployees[currentPairIndex * 2 + 1];

                let msg = `Page ${currentPairIndex + 1} of ${totalPairs}\n\nEmployees on this page:\n`;
                msg += `• ${firstEmp.name} (${firstEmp.position})`;
                if (secondEmp) {
                    msg += `\n• ${secondEmp.name} (${secondEmp.position})`;
                }
                msg += `\n\nWould you like to confirm this page now?`;

                showModal(
                    `Confirm Page ${currentPairIndex + 1}`,
                    msg,
                    () => { // On Confirm (Yes)
                        closeModal();
                        // Simulate printing/confirming
                        // In a real app, this would trigger actual print or save
                        setInteractiveProcessingState(prev => ({
                            ...prev,
                            currentPairIndex: prev.currentPairIndex + 1
                        }));
                    },
                    () => { // On Cancel
                        closeModal();
                        showModal('Process Cancelled', 'Process cancelled by the user.', null, null, false);
                        setInteractiveProcessingState({ isActive: false, checkedEmployees: [], currentPairIndex: 0 });
                        clearPrintTemplate();
                    },
                    true // Show cancel button
                );
            } else {
                // All pages processed
                logDataToSheet(checkedEmployees);
                clearPrintTemplate();
                showModal(
                    'Process Complete!',
                    `Total employees processed: ${checkedEmployees.length}\nPages handled: ${totalPairs}\nAll data has been saved to the Logged Data section.`,
                    null, null, false
                );
                setInteractiveProcessingState({ isActive: false, checkedEmployees: [], currentPairIndex: 0 });
            }
        }
    }, [interactiveProcessingState, populateTemplateForPair, logDataToSheet, clearPrintTemplate, showModal, closeModal]);

    // Main batch processing logic
    const processAndPrintAll = useCallback(() => {
        const checkedEmps = employees.filter(emp => emp.isChecked && emp.name.trim() !== '');

        if (checkedEmps.length === 0) {
            showModal('No Selection', 'No employees selected.', null, null, false);
            return;
        }

        const totalPairs = Math.ceil(checkedEmps.length / 2);

        showModal(
            'Confirm Batch Print',
            `This will process ${totalPairs} pages for ${checkedEmps.length} employees.\nDo you want to continue?`,
            () => { // On Confirm (Yes)
                closeModal();
                clearPrintTemplate();
                // Simulate processing each pair and "printing"
                for (let i = 0; i < totalPairs; i++) {
                    populateTemplateForPair(checkedEmps, i);
                    // In a real app, this is where actual print commands would go
                }
                logDataToSheet(checkedEmps);
                clearPrintTemplate();
                showModal('Batch Process Complete', 'All pages have been processed and the complete data has been saved!', null, null, false);
            },
            () => { // On Cancel (No)
                closeModal();
                showModal('Batch Process Cancelled', 'Batch process cancelled by the user.', null, null, false);
            },
            true // Show cancel button
        );
    }, [employees, templateData, showModal, closeModal, populateTemplateForPair, logDataToSheet, clearPrintTemplate]);

    // Component for the custom modal
    const Modal = ({ isOpen, title, message, onConfirm, onCancel, showCancel, onClose }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border-2 border-gray-300">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
                    <p className="text-gray-700 whitespace-pre-line mb-6">{message}</p>
                    <div className="flex justify-end space-x-3">
                        {showCancel && (
                            <button
                                onClick={() => { onCancel && onCancel(); onClose(); }}
                                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 ease-in-out shadow-sm"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={() => { onConfirm && onConfirm(); onClose(); }}
                            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out shadow-md"
                        >
                            {showCancel ? 'Confirm' : 'OK'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-inter text-gray-800">
            <h1 className="text-4xl font-extrabold text-center text-blue-800 mb-10 drop-shadow-sm">
                Employee Processing System
            </h1>

            {/* Template Inputs Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-3">Global Template Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={templateData.date}
                            onChange={handleTemplateChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <input
                            type="text"
                            id="destination"
                            name="destination"
                            value={templateData.destination}
                            onChange={handleTemplateChange}
                            placeholder="e.g., New York"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                        <input
                            type="text"
                            id="purpose"
                            name="purpose"
                            value={templateData.purpose}
                            onChange={handleTemplateChange}
                            placeholder="e.g., Business Trip"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input
                            type="text"
                            id="duration"
                            name="duration"
                            value={templateData.duration}
                            onChange={handleTemplateChange}
                            placeholder="e.g., 3 Days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Employee List Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-3">Select Employees (EMP Sheet)</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Select</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Position</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={emp.isChecked}
                                            onChange={() => handleEmployeeCheck(emp.id)}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.position}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200 flex flex-wrap justify-center gap-4">
                <button
                    onClick={processCheckedEmployeesInteractive}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Process Selected Employees (Interactive)
                </button>
                <button
                    onClick={processAndPrintAll}
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Process All Selected (Batch)
                </button>
                <button
                    onClick={uncheckAllBoxes}
                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Uncheck All
                </button>
            </div>

            {/* Print Preview Section (EP Sheet Simulation) */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-3">Print Preview (EP Sheet)</h2>
                {printPreviewData.employee1 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Employee 1 Card */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Employee 1 Details</h3>
                            <p><span className="font-semibold">Name:</span> {printPreviewData.employee1.name}</p>
                            <p><span className="font-semibold">Position:</span> {printPreviewData.employee1.position}</p>
                            <p><span className="font-semibold">Destination:</span> {printPreviewData.employee1.destination}</p>
                            <p><span className="font-semibold">Duration:</span> {printPreviewData.employee1.duration}</p>
                            <p><span className="font-semibold">Purpose:</span> {printPreviewData.employee1.purpose}</p>
                        </div>
                        {/* Employee 2 Card */}
                        {printPreviewData.employee2 && (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Employee 2 Details</h3>
                                <p><span className="font-semibold">Name:</span> {printPreviewData.employee2.name}</p>
                                <p><span className="font-semibold">Position:</span> {printPreviewData.employee2.position}</p>
                                <p><span className="font-semibold">Destination:</span> {printPreviewData.employee2.destination}</p>
                                <p><span className="font-semibold">Duration:</span> {printPreviewData.employee2.duration}</p>
                                <p><span className="font-semibold">Purpose:</span> {printPreviewData.employee2.purpose}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No employees currently in print preview.</p>
                )}
                {printPreviewData.employee1 && (
                    <div className="text-center mt-6 text-gray-600 font-medium">
                        Page {printPreviewData.currentPage} of {printPreviewData.totalPages}
                    </div>
                )}
            </div>

            {/* Logged Data Section (DATA Sheet Simulation) */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-3">Logged Data (DATA Sheet)</h2>
                {loggedData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loggedData.map((data, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.position}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.destination}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.duration}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.purpose}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No data has been logged yet.</p>
                )}
            </div>

            {/* Custom Modal Component */}
            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={modal.onCancel}
                showCancel={modal.showCancel}
                onClose={closeModal} // Pass closeModal to the Modal component
            />
        </div>
    );
};

export default App;
