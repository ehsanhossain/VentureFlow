/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface DriveBreadcrumb {
    id: string | null;
    name: string;
}

export interface ProspectInfo {
    type: 'investor' | 'target';
    code: string;
    id: string;
}

interface DriveBreadcrumbContextType {
    /** Current folder breadcrumbs from CloudFlow (empty when not on a drive page) */
    driveBreadcrumbs: DriveBreadcrumb[];
    /** Called by DriveExplorer to publish its breadcrumbs */
    setDriveBreadcrumbs: (crumbs: DriveBreadcrumb[]) => void;
    /** Called by DriveExplorer to navigate to a folder by id */
    onNavigateFolder: ((folderId: string | null) => void) | null;
    /** Called by DriveExplorer to register its navigation handler */
    setOnNavigateFolder: (handler: ((folderId: string | null) => void) | null) => void;
    /** Prospect info (type, code, id) for building logical breadcrumb path */
    prospectInfo: ProspectInfo | null;
    /** Called by DriveExplorer to publish prospect info */
    setProspectInfo: (info: ProspectInfo | null) => void;
    /** Clear everything (called when leaving drive page) */
    clearDriveBreadcrumbs: () => void;
}

const DriveBreadcrumbContext = createContext<DriveBreadcrumbContextType>({
    driveBreadcrumbs: [],
    setDriveBreadcrumbs: () => { },
    onNavigateFolder: null,
    setOnNavigateFolder: () => { },
    prospectInfo: null,
    setProspectInfo: () => { },
    clearDriveBreadcrumbs: () => { },
});

export const useDriveBreadcrumbs = () => useContext(DriveBreadcrumbContext);

export const DriveBreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [driveBreadcrumbs, setDriveBreadcrumbs] = useState<DriveBreadcrumb[]>([]);
    const [onNavigateFolder, setOnNavigateFolderState] = useState<((folderId: string | null) => void) | null>(null);
    const [prospectInfo, setProspectInfo] = useState<ProspectInfo | null>(null);

    const setOnNavigateFolder = useCallback((handler: ((folderId: string | null) => void) | null) => {
        // Wrap in a function to avoid React treating the handler as a state updater
        setOnNavigateFolderState(() => handler);
    }, []);

    const clearDriveBreadcrumbs = useCallback(() => {
        setDriveBreadcrumbs([]);
        setOnNavigateFolderState(null);
        setProspectInfo(null);
    }, []);

    return (
        <DriveBreadcrumbContext.Provider value={{
            driveBreadcrumbs,
            setDriveBreadcrumbs,
            onNavigateFolder,
            setOnNavigateFolder,
            prospectInfo,
            setProspectInfo,
            clearDriveBreadcrumbs,
        }}>
            {children}
        </DriveBreadcrumbContext.Provider>
    );
};
