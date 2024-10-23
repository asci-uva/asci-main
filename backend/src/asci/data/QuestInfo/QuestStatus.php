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
     * Change the quest status to In progress if it meets the unlock condition
     * Return true if a status changes
     * @param mixed $currQuest
     * @return void
     */
    public function changeQuestStatusToInProgress($currQuest): bool
    {
        if ($currQuest->getQuestCompletionStatus() === 'Completed') {
            return false;
        }

        $questId = $currQuest->getQuestId();
        $userId = $currQuest->getUserId();
        $params = $currQuest->getParams();

        $this->logger->addDebug("Change status to in progress for quest", array("quest id:" => $questId, "quest mnemonic" => $currQuest->getMnemonic(), "user id:" => $userId, "course id" => $this->courseId, "params" => $params));

        // Unlock quests that meet the prereqs
        switch ($currQuest->getMnemonic()) {
            case "OH":
            case "GS":
                $prereqs = explode(" ", $currQuest->getPrerequisites());
                $this->logger->addDebug("Prereqs for quests", array("prereqs" => $prereqs));

                if ($prereqs[1] == 0 || $this->DBUserQuest->checkQuestStatus($prereqs[0], $prereqs[1], $userId, $this->courseId, 'Completed') == 1) {
                    $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    return true;
                } else {
                    return false;
                }
            default:
                return false;
        }
    }

    /**
     * Change the quest status to Completed if it meets the completion condition
     * Return true if a status changes
     * @param mixed $currQuest
     * @return void
     */
    public function changeQuestStatusToCompleted($currQuest): bool
    {
        if ($currQuest->getQuestCompletionStatus() === 'Completed') {
            return false;
        }

        $questId = $currQuest->getQuestId();
        $userId = $currQuest->getUserId();
        $params = $currQuest->getParams();

        $this->logger->addDebug("Change status to completed for quest", array("quest id:" => $questId, "user id:" => $userId, "course id" => $this->courseId));

        $OH_count = $this->officeHoursCount($userId, $this->courseId);
        $onTimeCount = $this->onTimeGradescopeAssignmentCount($userId, $this->courseId);
        // Complete quests if they meet the conditions
        switch ($currQuest->getMnemonic()) {
            case "OH":
                if ($OH_count >= $params) {
                    $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                    $currQuest->setQuestCompletionStatus('Completed');
                    return true;
                } else {
                    return false;
                }
            case "GS":
                if ($onTimeCount >= $params) {
                    $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                    $currQuest->setQuestCompletionStatus('Completed');
                    return true;
                } else {
                    return false;
                }
            default:
                return false;
        }
    }

    public function confirmVerification($currQuest)
    {
        if ($currQuest->getQuestCompletionStatus() !== 'Unverified') {
            return false;
        }
        $questId = $currQuest->getQuestId();
        $userId = $currQuest->getUserId();

        // If the quest changes status to complete, it's verified. Else, if the status doesn't change it should go back to being in progress
        if (!$this->changeQuestStatusToCompleted($currQuest)) {
            $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
            $currQuest->setQuestCompletionStatus('In progress');
            $this->logger->addDebug("Verification was false, change status to in progress", array("quest id:" => $questId, "user id:" => $userId, "course id" => $this->courseId, "status" => $currQuest->getQuestCompletionStatus()));
        } else {
            $this->logger->addDebug("Verification was true, change status to completed", array("quest id:" => $questId, "user id:" => $userId, "course id" => $this->courseId, "status" => $currQuest->getQuestCompletionStatus()));
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