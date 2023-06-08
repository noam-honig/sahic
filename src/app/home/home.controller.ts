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
                subitems {
                  name
                  column_values {
                    id
                    title
                    value
                  }
                }
              }
            }
          }`, {
      id: id
    });
    const r: LinksResult = first.boards[0].items[0];

    if (r?.column_values)
      r.column_values = r.column_values.filter(x => x.value?.toLocaleLowerCase().startsWith("\"https")).map(y => ({ ...y, value: JSON.parse(y.value) }));
    if (r.subitems) {
      for (const s of r.subitems) {
        let link = s.column_values.find(x => x.value?.toLocaleLowerCase().startsWith("\"https"))
        if (link)
          r.column_values.push({
            title: s.name,
            value: JSON.parse(link.value)
          })
      }
    }
    delete r.subitems;
    return r;
  }
  @BackendMethod({ allowed: true })
  static async getTeenagers() {
    const result: {
      name: string,
      items: {
        id: number,
        name: string,
        attended?: boolean
      }[]
    } = await gql(`query  {
      boards (ids:[1363121136]){
        id
        name
        board_folder_id
        board_kind,
        items{
          id
          name
        
        }
      
       
        
      }
    }`, {}).then(x => x.boards[0]);
    return result;
  }

}

export interface LinksResult {
  name: string,
  column_values: { title: string, value: string }[]
  subitems?: LinksResult[]
}
