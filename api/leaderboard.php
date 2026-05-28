<?php
require __DIR__ . '/bootstrap.php';

$input = array_merge($_GET, body());
$action = $input['action'] ?? 'list';

if ($action === 'list') {
    $board = filterLeaderboardEntries(readJson('leaderboard.json'));
    usort($board, function ($a, $b) {
        if (($b['stars'] ?? 0) !== ($a['stars'] ?? 0)) return ($b['stars'] ?? 0) - ($a['stars'] ?? 0);
        return ($b['coins'] ?? 0) - ($a['coins'] ?? 0);
    });
    respond(['ok' => true, 'leaderboard' => array_slice($board, 0, 50)]);
}

if ($action === 'save') {
    $token = $input['token'] ?? '';
    $users = readJson('users.json');
    $idx = findUserIndex($users, $token);
    if ($idx === null) respond(['ok' => false, 'error' => '未登录'], 401);

    $users[$idx]['levelStars'] = normalizeLevelStars($input['levelStars'] ?? ($users[$idx]['levelStars'] ?? []));
    $users[$idx]['stars'] = count(array_filter($users[$idx]['levelStars']));
    $users[$idx]['coins'] = intval($input['coins'] ?? ($users[$idx]['coins'] ?? 0));
    $users[$idx]['maxLevel'] = intval($input['maxLevel'] ?? ($users[$idx]['maxLevel'] ?? 0));
    $users[$idx]['currentLevel'] = max(0, min(19, intval($input['currentLevel'] ?? ($users[$idx]['currentLevel'] ?? 0))));
    if (isset($input['skin'])) $users[$idx]['skin'] = $input['skin'];
    if (isset($input['trail'])) $users[$idx]['trail'] = $input['trail'];
    if (isset($input['owned'])) $users[$idx]['owned'] = $input['owned'];
    if (isset($input['equipped'])) $users[$idx]['equipped'] = $input['equipped'];
    if (isset($input['muteDev'])) $users[$idx]['muteDev'] = (bool)$input['muteDev'];
    if (isset($input['achievements'])) $users[$idx]['achievements'] = $input['achievements'];
    writeJson('users.json', $users);

    $user = $users[$idx];
    $board = filterLeaderboardEntries(readJson('leaderboard.json'));
    if (!isDemoNickname($user['nickname'] ?? '')) {
        $found = false;
        foreach ($board as &$row) {
            if ($row['nickname'] === $user['nickname']) {
                $row['stars'] = $user['stars'];
                $row['coins'] = $user['coins'];
                $row['maxLevel'] = $user['maxLevel'];
                $row['updated'] = time();
                $found = true;
                break;
            }
        }
        unset($row);
        if (!$found) {
            $board[] = [
                'nickname' => $user['nickname'],
                'stars' => $user['stars'],
                'coins' => $user['coins'],
                'maxLevel' => $user['maxLevel'],
                'updated' => time(),
            ];
        }
    }
    writeJson('leaderboard.json', $board);
    $out = $user;
    unset($out['password']);
    respond(['ok' => true, 'profile' => $out]);
}

respond(['ok' => false, 'error' => 'unknown action'], 400);
