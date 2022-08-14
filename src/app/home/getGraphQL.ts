import axios from "axios";

export async function gql( s: string,variables: any) {
    return (await axios.post('https://api.monday.com/v2',
        JSON.stringify({
            "query": s,
            "variables": variables
        })
        , {
            headers: {
                'authorization': process.env["MONDAY_API_TOKEN"]!,
                'content-type': 'application/json',
            },
        })).data.data;


}