const SQL_UNAMBIGUOUS_STARTER_PATTERN =
    /^\s*(select|selectblob|insert|update|updateblob|delete|commit|rollback|connect|disconnect|declare|execute|prepare|describe)\b/i;

const SQL_CURSOR_STARTER_PATTERN =
    /^\s*(open|fetch|close)\b(?!\s*\()/i;

export function isLikelySqlStarter(line: string): boolean {
    const trimmed = line.trim();

    if (!trimmed) {
        return false;
    }

    return SQL_UNAMBIGUOUS_STARTER_PATTERN.test(trimmed)
        || SQL_CURSOR_STARTER_PATTERN.test(trimmed);
}