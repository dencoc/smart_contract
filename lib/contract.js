export const CONTRACT_ADDRESS = "0xC396cf227d564651154635E6181F56D849B84950"

export const POSTER_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "string",
                name: "action",
                type: "string",
            },
        ],
        name: "Post",
        type: "event",
    },
    {
        inputs: [{ internalType: "string", name: "action", type: "string" }],
        name: "post",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
]
