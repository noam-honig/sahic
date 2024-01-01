import { gql } from '../home/getGraphQL';

export async function getTeenagers(
  board: number,
  internal = false
): Promise<TeenagersResult> {
  const result = await getBoardMembers(board);
  if (!result) throw 'טופס נוכחות לא נמצא';
  function getValueFromDescription(key: string) {
    return result.description
      ?.split('\n')
      .map((x) => x.split(':'))
      .find((x) => x[0]?.trim() == key)?.[1]
      ?.trim();
  }

  if (getValueFromDescription(ATTENDANCE_KEY)?.trim() != 'כן') {
    throw 'טופס נוכחות לא פתוח';
  }
  if (internal) {
    result.attendance = getValueFromDescription(ATTENDANCE_BOARD_KEY);
    result.volunteerAttendance = getValueFromDescription(
      VOLUNTEER_ATTENDANCE_BOARD_KEY
    );
  } else {
    delete result.attendance;
  }
  const volunteerBoard = getValueFromDescription(VOLUNTEER_BOARD_KEY);
  if (volunteerBoard) {
    const volunteers = await getBoardMembers(+volunteerBoard);
    result.volunteers = volunteers.items;
    result.volunteersBoardName = volunteers.name;
  }

  return result;
}

export const ATTENDANCE_BOARD_KEY = 'לוח נוכחות';
export const ATTENDANCE_KEY = 'דיווח נוכחות';
export const VOLUNTEER_BOARD_KEY = 'לוח מתנדבים';
export const VOLUNTEER_ATTENDANCE_BOARD_KEY = 'לוח נוכחות מתנדבים';
async function getBoardMembers(board: number) {
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
  result.items = (result as any).items_page.items;
  delete (result as any).items_page;
  result.items.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export function updateAttendanceBoardIdToDescription(
  description: string,
  id: number,
  key: string
) {
  const lines = description
    .split('\n')
    .filter((x) => !x.trim().startsWith(key));
  lines.push(`${key}: ${id}`);
  return lines.join('\n');
}
export interface TeenagersResult {
  id: number;
  description?: string | undefined;
  name: string;
  attendance?: string | undefined;
  volunteerAttendance?: string | undefined;
  items: {
    id: number;
    name: string;
  }[];
  volunteersBoardName?: string;
  volunteers: {
    id: number;
    name: string;
  }[];
}
export function getValueFromDescription(description: string, key: string) {
  return description
    ?.split('\n')
    .map((x) => x.split(':'))
    .find((x) => x[0]?.trim() == key)?.[1]
    ?.trim();
}
