import React from "react";

const ActionsInfo = ({ shipsReady = false, canShoot = false, ready}) => {
    console.log(shipsReady);
    if (!shipsReady) {
        return <button className="btn-ready" onClick={ready}>Ships are ready</button>
    }

    return (
        <div>
            {canShoot ? <p>Shoot!</p> : <p>Enemy turn</p>}
        </div>
    )
}
export default ActionsInfo