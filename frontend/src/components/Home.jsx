import React from "react";

function Home() {
  return (
    <div className="home">
      <div className="container">
        <div className="row align-items-center my-5">
          <div className="col-lg-5">
            <h1 className="font-weight-light">Queue Overview</h1>
            <p>
                There are 3 TAs answerng questions and 10 students waiting in queue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;