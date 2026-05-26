import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import ManagePoints from "./ManagePoints";
import PendingApprovals from "./PendingApprovals";

function PointsHome(props) {
    const {user, courseList, course} = useUser();
    const [refresh, setRefresh] = useState(0);
    
    const refreshPage = () => {
        setRefresh(prev => prev + 1);
    };
    
    //source for refreshing content when switching tabs: https://www.reddit.com/r/react/comments/1be4624/using_event_listener_in_useeffect/
    useEffect(() => {
        const tabs = document.querySelectorAll('[data-bs-toggle="pill"]');
        refreshPage();
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', refreshPage);
        });
        
        return () => {
            tabs.forEach(tab => {
            tab.removeEventListener('shown.bs.tab', refreshPage);
            });
        };
    }, []);

    return (
    <>
      <div className="container p-4">
        <h1>Student Points</h1>
        <div className="card">    
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="pills-tab" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button className="nav-link active" id="pills-list-tab" data-bs-toggle="pill" data-bs-target="#pills-list" type="button" role="tab" aria-controls="pills-list" aria-selected="true">Student List</button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="pills-batch-tab" data-bs-toggle="pill" data-bs-target="#pills-batch" type="button" role="tab" aria-controls="pills-batch" aria-selected="false">Pending Approvals</button>
                    </li>
                </ul>
            </div>
            
            <div className="tab-content card-body" id="pills-tabContent">
              
              <div className="tab-pane fade show active" id="pills-list" role="tabpanel" aria-labelledby="pills-list-tab">               
                <div className="col-md-12 my-auto">
                    <ManagePoints refresh={refresh} {...props} />                                
                </div>
              </div>

              <div className="tab-pane fade" id="pills-batch" role="tabpanel" aria-labelledby="pills-batch-tab">
                <div className="col-md-12 my-auto mb-2">
                    <PendingApprovals refresh={refresh} {...props} />                                
                </div>
              </div>

            </div>
          </div>
        </div>
    </>
  );
}

export default PointsHome;
