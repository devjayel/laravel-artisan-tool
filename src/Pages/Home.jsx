import { useState, useEffect } from "react";
import Layout from "@/Layouts/DefaultLayout"

import Workspace from "./Partials/Workspace";
import ProjectSelection from "./Partials/ProjectSelection";

export default function Home({ artisanCommand }) {
    const [page, setPage] = useState("home");
    const changePage = (page) => {
        setPage(page);
    }
    useEffect(() => { console.log(page) }, [page])
    return (
        <Layout>
            {page === "home" && <ProjectSelection changePage={changePage} />}
            {page === "workspace" && <Workspace artisanCommand={artisanCommand} changePage={changePage} />}
        </Layout>
    )
}