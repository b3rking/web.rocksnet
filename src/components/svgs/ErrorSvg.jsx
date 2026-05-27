import React from 'react'

const Error = () => {
    return (
        <React.Fragment>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
            >
                <circle cx="12" cy="12" r="10" fill="#EF4444" />

                <path
                    d="M12 7V13"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                />

                <circle cx="12" cy="17" r="1.2" fill="white" />
            </svg>
        </React.Fragment>
    )
}

export default Error