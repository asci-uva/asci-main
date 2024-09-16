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

    private $DBUserQuest;

    public function __construct($db, $courseId)
    {
        $this->db = $db;
        $this->courseId = $courseId;

        global $log;
        $this->logger = new \Monolog\Logger('QuestStatus');
        $this->logger->pushHandler($log);

        $this->DBUserQuest = new \asci\server\database\DBUserQuest($this->db);
    }

    /**
     * Change the quest status to Completed or In progress if it meets the completion condition
     * @param mixed $currQuest
     * @return void
     */
    public function changeQuestStatus($currQuest)
    {
        if ($currQuest->getQuestCompletionStatus() === 'Completed') {
            return;
        }
        
        $questId = $currQuest->getQuestId();
        $userId = $currQuest->getUserId();

        $this->logger->addDebug("Change status to completed for quest", array("quest id:" => $questId, "user id:" => $userId, "course id" => $this->courseId));

        // Unlock quests that meet the prereqs
        if ($currQuest->getQuestCompletionStatus() === 'Locked') {
            switch ($currQuest->getMnemonic()) {
                // Quests with no prereqs
                case "OH1":
                case "GS1":
                    $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    break;
                case "OH3":
                    if ($this->DBUserQuest->checkQuestStatus("OH1", $userId, $this->courseId, 'Completed') === 1) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    }
                    break;
                case "OH10":
                    if ($this->DBUserQuest->checkQuestStatus("OH3", $userId, $this->courseId, 'Completed') === 1) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    }
                    break;
                case "GS3":
                    if ($this->DBUserQuest->checkQuestStatus("GS1", $userId, $this->courseId, 'Completed') === 1) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    }
                    break;
                case "GS10":
                    if ($this->DBUserQuest->checkQuestStatus("GS3", $userId, $this->courseId, 'Completed') === 1) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    }
                    break;
            }
        }

        // Complete quests if they meet the conditions
        else if ($currQuest->getQuestCompletionStatus() === 'In progress') {

            $OH_count = $this->officeHoursCount($userId, $this->courseId);
            $onTimeCount = $this->onTimeGradescopeAssignmentCount($userId, $this->courseId);
            switch ($currQuest->getMnemonic()) {
                case "OH1":
                    if ($OH_count >= 1) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                        $this->logger->addDebug("OH1 true");
                    }
                    break;
                case "OH3":
                    if ($OH_count >= 3) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                        $this->logger->addDebug("OH count for quest", array("OH_count" => $OH_count, "quest id:" => $questId, "user id:" => $userId));
                        $this->logger->addDebug("OH3 true");
                    }
                    break;
                case "OH10":
                    if ($OH_count >= 10) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                        $this->logger->addDebug("OH10 true");
                    }
                    break;
                case "GS1":
                    if ($onTimeCount >= 1) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                    break;
                case "GS3":
                    if ($onTimeCount >= 3) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                        $currQuest->setQuestCompletionStatus('Completed');
                    }
                    break;
                case "GS10":
                    if ($onTimeCount >= 10) {
                        $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
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