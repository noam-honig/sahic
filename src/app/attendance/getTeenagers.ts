import { gql } from '../home/getGraphQL';

export async function getTeenagers(
  board: number,
  internal = false
): Promise<TeenagersResult> {
  const result: TeenagersResult = await gql(
    `#graphql
query ($board: ID!) {
  boards(ids: [$board]) {
    id
    name
    description
    items_page(limit: 500) {
      items {
        id
        name
      }
    }
  }
}`,
    {
      board,
    }
  ).then((x) => x.boards[0]);
  if (!result) throw 'טופס נוכחות לא נמצא';
  let attendanceLine = result.description
    ?.split('\n')
    .find((x) => x.trim().startsWith(ATTENDANCE_KEY))
    ?.split(':');
  if (attendanceLine?.[1]?.trim() != 'כן') {
    throw 'טופס נוכחות לא פתוח';
  }
  result.attendance = result.description
    ?.split('\n')
    .find((x) => x.trim().startsWith(ATTENDANCE_BOARD_KEY))
    ?.split(':')[1]
    ?.trim();
  if (!internal) {
    delete result.description;
    delete result.attendance;
  }
  result.items = (result as any).items_page.items;
  delete (result as any).items_page;
  result.items.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export const ATTENDANCE_BOARD_KEY = 'לוח נוכחות';
export const ATTENDANCE_KEY = 'דיווח נוכחות';
export function updateAttendanceBoardIdToDescription(
  description: string,
  id: number
) {
  const lines = description
    .split('\n')
    .filter((x) => !x.trim().startsWith(ATTENDANCE_BOARD_KEY));
  lines.splice(
    lines.findIndex((x) => x.trim().startsWith(ATTENDANCE_KEY)) + 1,
    0,
    `${ATTENDANCE_BOARD_KEY}: ${id}`
  );
  return lines.join('\n');
}
export interface TeenagersResult {
  id: number;
  description?: string | undefined;
  name: string;
  attendance?: string | undefined;
  items: {
    id: number;
    name: string;
    attended?: boolean;
  }[];
}
