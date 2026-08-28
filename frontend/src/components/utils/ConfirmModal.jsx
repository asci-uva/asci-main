import React from "react";

function ConfirmModal({ show, title, onCancel, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel", children }) {
    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
                        <button className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;