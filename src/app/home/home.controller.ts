import { BackendMethod, Remult } from "remult";
import { gql } from "./getGraphQL";

export class HomeController {
    @BackendMethod({ allowed: true })
    static async getLinks(id: number) {
        const first = await gql(`query ($id: Int!) {
            boards(ids: [3087291764]) {
              id
              name
              items (ids: [$id]){
                id
                name
                column_values{
                  id
                  title
                  value
                }
              }
            }
          }`, {
            id: id
        });
        const r: LinksResult = first.boards[0].items[0];

        if (r?.column_values)
            r.column_values = r.column_values.filter(x => x.value?.toLocaleLowerCase().startsWith("\"https")).map(y => ({ ...y, value: JSON.parse(y.value) }));

        return r;
    }
}

export interface LinksResult {
    name: string,
    column_values: { title: string, value: string }[]
}