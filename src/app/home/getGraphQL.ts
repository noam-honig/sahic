import axios from 'axios';

export async function gql(s: string, variables: any) {
  const r = await axios.post(
    'https://api.monday.com/v2',
    JSON.stringify({
      query: s,
      variables: variables,
    }),
    {
      headers: {
        authorization: process.env['MONDAY_API_TOKEN']!,
        'content-type': 'application/json',
        'API-Version': '2023-10',
      },
    }
  );
  if (!r.data.data) {
    console.log(r.data);
  }
  return r.data.data;
}
