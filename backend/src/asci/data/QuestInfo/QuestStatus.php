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

            $OH_count = $this->officeHoursCount($userId, $this->courseId);
            $onTimeCount = $this->onTimeGradescopeAssignmentCount($userId, $this->courseId);

            $this->logger->addDebug("Change status for quest", array("quest id:" => $questId, "user id:" => $userId, "course id" => $this->courseId));

            switch ($currQuest->getMnemonic()) {
                case "OH1":
                    $this->logger->addDebug("OH1");
                    if ($OH_count >= 1) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                        $this->logger->addDebug("OH1 true");
                    }
                    break;
                case "OH3":
                    $this->logger->addDebug("OH3");
                    if ($OH_count >= 3) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');$this->logger->addDebug("OH count for quest", array("OH_count" => $OH_count, "quest id:" => $questId, "user id:" => $userId));
                        $this->logger->addDebug("OH3 true");
                    }
                    break;
                case "OH10":
                    $this->logger->addDebug("OH10");
                    if ($OH_count >= 10) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                        $this->logger->addDebug("OH10 true");
                    }
                    break;
                case "GS1":
                    if ($onTimeCount >= 1) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                    break;
                case "GS3":
                    if ($onTimeCount >= 3) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                    break;
                case "GS10":
                    if ($onTimeCount >= 10) {
                        (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                    break;
            }
        }
    }

    public function officeHoursCount($userId, $courseId)
    {
        return (new \asci\server\database\DBSession($this->db))->getCompletedOfficehoursCount($userId, $courseId);
    }

    public function onTimeGradescopeAssignmentCount($userId, $courseId)
    {
        return (new \asci\server\database\DBSynchronization($this->db))->getOnTimeSubmissionCount($userId, $courseId);
    }
}