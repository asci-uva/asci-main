<?php

namespace asci\data\QuestInfo;

error_reporting(E_ALL);
ini_set('display_errors', 0);

class QuestStatus
{

    /**
     * @var \Monolog\Logger $logger the logger for this server
     */
    private $logger;
    private $courseId;

    private $db;
    // private $currQuest;

    public function __construct($db, $courseId)
    {
        $this->db = $db;
        $this->courseId = $courseId;

        global $log;
        $this->logger = new \Monolog\Logger('QuestStatus');
        $this->logger->pushHandler($log);

    }


    public function changeStatus($currQuest)
    {
        if ($currQuest->getQuestCompletionStatus() != 'Completed') {
            $questId = $currQuest->getQuestId();
            $userId = $currQuest->getUserId();

            $count = $this->OfficeHoursCount($userId, $this->courseId);

            switch ($currQuest->getMnemonic()) {
                case "OH1":
                    if ($count >= 1) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                case "OH3":
                    if ($count >= 3) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                case "OH10":
                    if ($count >= 10) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
            }
        }
    }

    public function OfficeHoursCount($userId, $courseId)
    {
        return (new \asci\server\database\DBSession($this->db))->getCompletedOfficehoursCount($userId, $courseId);
    }
}