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
    public function changeQuestStatusToInProgress($currQuest)
    {
        if ($currQuest->getQuestCompletionStatus() === 'Completed') {
            return;
        }

        $questId = $currQuest->getQuestId();
        $userId = $currQuest->getUserId();
        $params = $currQuest->getParams();

        $this->logger->addDebug("Change status to in progress for quest", array("quest id:" => $questId, "user id:" => $userId, "course id" => $this->courseId, "params" => $params));

        // Unlock quests that meet the prereqs
        switch ($currQuest->getMnemonic()) {
            case "OH":
            case "GS":
                $prereqs = explode(" ", $currQuest->getPrerequisites());
                $this->logger->addDebug("Prereqs for quests", array("prereqs" => $prereqs));

                if ($prereqs[1] == 0 || $this->DBUserQuest->checkQuestStatus($prereqs[0], $prereqs[1], $userId, $this->courseId, 'Completed') == 1) {
                    $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
                    $this->changeQuestStatusToCompleted($currQuest);
                }
                break;
        }
    }

    public function changeQuestStatusToCompleted($currQuest)
    {
        if ($currQuest->getQuestCompletionStatus() === 'Completed') {
            return;
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
                    $this->logger->addDebug("OH1 true");
                }
                break;
            case "GS":
                if ($onTimeCount >= $params) {
                    $this->DBUserQuest->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                    $currQuest->setQuestCompletionStatus('Completed');
                }
                break;
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