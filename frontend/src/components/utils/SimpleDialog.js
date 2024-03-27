import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Markdown from "react-markdown";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";

const SimpleDialog = (props) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!props.contexts || props.contexts.length === 0) {
        return null;
    }

    function openDialog() {
        console.log("open dialog");
        console.log(props.contexts);
        setIsOpen(true);
    }

    function closeDialog() {
        setIsOpen(false);
    }

    const displayContext = (context, index) => {
        return (
            <div key={index}>
                <h2 className="font-medium">
                    This response is based on information found in{" "}
                    {context.file_name}
                    {context.file_path ? ` (${context.file_path})` : null}
                    {context.page_label
                        ? ` on page ${context.page_label}`
                        : null}
                    .
                </h2>

                <Markdown
                    className="prose font-semibold max-h-60 overflow-auto bg-gray-200 p-4 rounded-lg my-4"
                    children={`${context.text} ...`}
                />
            </div>
        );
    };

    return (
        <>
            <button className="absolute bottom-3 right-3" id="chat-context">
                <BookOpenIcon
                    className="w-6 h-6 hover:text-gray-500 cursor-pointer dark:text-gray-50"
                    alt="icon"
                    type="button"
                    onClick={openDialog}
                />
                <Tooltip
                    anchorSelect="#chat-context"
                    place="top"
                    className="bg-gray-800 text-white p-2 rounded-lg shadow-md text-sm font-medium"
                >
                    <div>
                        <span>View context</span>
                    </div>
                </Tooltip>
            </button>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 z-10 overflow-y-auto"
                    onClose={closeDialog}
                >
                    <div className="min-h-screen px-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
                        </Transition.Child>
                        {/* This element is to trick the browser into centering the modal contents. */}
                        <span
                            className="inline-block h-screen align-middle"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <div className="inline-block w-full max-w-prose p-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                                <Dialog.Title
                                    as="h2"
                                    className="text-xl font-bold leading-6 text-gray-900"
                                >
                                    Response Context
                                </Dialog.Title>
                                <div className="mt-2">
                                    {props.contexts.map((context, index) =>
                                        displayContext(context, index)
                                    )}
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        className="text-button"
                                        onClick={closeDialog}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default SimpleDialog;
