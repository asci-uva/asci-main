import React from "react";
import {useEffect, useState} from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import { formatRole } from "../utils/roles";

function ViewRoster(props) {

  let {user, getCourse, courseRoster, setCourseRoster, refreshCourseRoster} = useUser();
  let course = getCourse();

  let url = props.url; 
  let docRoot = props.documentRoot;

  useEffect(() => {
    if (course) {
      refreshCourseRoster();
    }
  }, [course]);

  /* Handle searching through the table */
  /* ---------------------------------- */
  const [search, setSearch] = useState("");

  const onSearchBarChange = (e) => {
    setSearch(e.target.value);
  }

  const matchesSearch = (person) => {
    const filter = search.trim().toUpperCase();
    if (filter === "") return true;

    return [person.computing_id, person.fname, person.lname, person.pname, formatRole(person.role)]
      .some(field => (field ?? "").toString().toUpperCase().includes(filter));
  }

  const roster = Object.keys(courseRoster ?? {}).map(k => courseRoster[k]);
  const visibleRoster = roster.filter(matchesSearch);
  /* ---------------------------------- */
  /* ---------------------------------- */


  const RosterTableHeaderRow = () => {
    return (
        <tr>
          <th>Comp. Id.</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Pref. Name</th>
          <th>Role</th>
        </tr>
      );
  }


  const RosterTableRow = ({data}) => {
    return Object.keys(data).map(k =>
      <tr key={k}>
        <td><b>{data[k].computing_id}</b></td>
        <td>{data[k].fname}</td>
        <td>{data[k].lname}</td>
        <td>{data[k].pname}</td>
        <td>{formatRole(data[k].role)}</td>
      </tr>
    );
  }

  const RosterTable = ({data}) => {
    if(roster.length === 0)
      return (
        <h5>There does not appear to be anyone enrolled yet. </h5>
      );

    if(data.length > 0){
      return (
            <table id="rosterTable" className="table table-striped table-hover table-sm">
              <thead>
                <RosterTableHeaderRow />
              </thead>
              <tbody className="table-group-divider">
                <RosterTableRow data={data} />
              </tbody>
            </table>
          
      );
    }
    else return (
      <h5>No one on the roster matches that search.</h5>
    );
  }

  return (
      <div className="card">
        <h4 className="card-header">View Roster</h4>
        <div className="card-body">
          <div>
            <input
              id="rosterSearchTextBox"
              type="text" className="mb-1"
              value={search}
              onChange={onSearchBarChange}
              placeholder="Search..." />
          </div>
          <div style={{height: 500 + 'px'}} className="overflow-auto">
            <RosterTable data={visibleRoster} />
          </div>
        </div>
      </div>
  );
}

export default ViewRoster;
