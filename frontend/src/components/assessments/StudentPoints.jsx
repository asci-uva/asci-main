import React, { useState, useEffect } from "react";
import ManagePoints from "../admin/ManagePoints";
import PendingApprovals from "../admin/PendingApprovals";

function StudentPoints(props) {
    const [refresh, setRefresh] = useState(0);

    const refreshPage = () => {
        setRefresh(prev => prev + 1);
    };

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
        <ul className="nav nav-pills mb-3" id="points-tab" role="tablist">
            <li className="nav-item" role="presentation">
                <button className="nav-link active" id="points-list-tab" data-bs-toggle="pill" data-bs-target="#points-list" type="button" role="tab" aria-controls="points-list" aria-selected="true">Student List</button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link" id="points-batch-tab" data-bs-toggle="pill" data-bs-target="#points-batch" type="button" role="tab" aria-controls="points-batch" aria-selected="false">Pending Approvals</button>
            </li>
        </ul>

        <div className="tab-content" id="points-tabContent">

          <div className="tab-pane fade show active" id="points-list" role="tabpanel" aria-labelledby="points-list-tab">
            <div className="col-md-12 my-auto">
                <ManagePoints refresh={refresh} {...props} />
            </div>
          </div>

          <div className="tab-pane fade" id="points-batch" role="tabpanel" aria-labelledby="points-batch-tab">
            <div className="col-md-12 my-auto mb-2">
                <PendingApprovals refresh={refresh} {...props} />
            </div>
          </div>

        </div>
      </>
  );
}

export default StudentPoints;
