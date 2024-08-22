import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import { Box, Button, Flex, HStack, Input, Textarea } from "@chakra-ui/react";
import { Moment } from "moment";
import { App, moment, Notice, TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppHelper, PostBlock } from "src/app-helper";
import { Settings } from "src/settings";
import { sorter } from "src/utils/collections";
import { replaceDayToJa } from "src/utils/strings";

export const ReactView = ({
  app,
  settings,
}: {
  app: App;
  settings: Settings;
}) => {
  const [date, setDate] = useState<Moment>(moment());
  const appHelper = useMemo(() => new AppHelper(app), [app]);
  const [currentDailyNote, setCurrentDailyNote] = useState<TFile | null>(null);
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState<PostBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const canSubmit = useMemo(() => input.length > 0, [input]);

  const updateCurrentDailyNote = () => {
    const n = getDailyNote(date, getAllDailyNotes()) as TFile | null;
    if (n?.path !== currentDailyNote?.path) {
      setCurrentDailyNote(n);
    }
  };

  const updatePosts = async (note: TFile) => {
    setPosts(
      ((await appHelper.getPostBlocks(note)) ?? [])
        ?.filter((x) => x.blockType === "fw")
        .sort(sorter((x) => x.timestamp.unix(), "desc")),
    );
  };

  const handleClickOpenDailyNote = async () => {
    if (!currentDailyNote) {
      new Notice("デイリーノートが存在しなかったので新しく作成しました");
      await createDailyNote(date);
      // 再読み込みをするためにクローンを入れて参照を更新
      setDate(date.clone());
    }

    // デイリーノートがなくてif文に入った場合、setDateからのuseMemoが間に合わずcurrentDailyNoteの値が更新されないので、意図的に同じ処理を呼び出す
    await app.workspace
      .getLeaf(true)
      .openFile(getDailyNote(date, getAllDailyNotes()));
  };
  const handleChangeCalendarDate = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setDate(moment(event.target.value));
  };
  const handleClickMovePrevious = () => {
    setDate(date.clone().subtract(1, "day"));
  };
  const handleClickMoveNext = async () => {
    setDate(date.clone().add(1, "day"));
  };
  const handleClickToday = async () => {
    setDate(moment());
  };

  const handleClickSubmit = useCallback(async () => {
    setIsLoading(true);
    const text = `- ${moment().format("HH:mm")} ${input.replace("\n", "\n  ")}`;

    if (!currentDailyNote) {
      new Notice("デイリーノートが存在しなかったので新しく作成しました");
      await createDailyNote(date);
      // 再読み込みをするためにクローンを入れて参照を更新
      setDate(date.clone());
    }

    // デイリーノートがなくてif文に入った場合、setDateからのuseMemoが間に合わずcurrentDailyNoteの値が更新されないので、意図的に同じ処理を呼び出す
    await appHelper.insertTextToTimeline(
      getDailyNote(date, getAllDailyNotes()),
      text,
    );
    setInput("");
    setIsLoading(false);
  }, [currentDailyNote, date, appHelper, input]);

  useEffect(() => {
    updateCurrentDailyNote();
  }, [date]);

  useEffect(() => {
    if (!currentDailyNote) {
      return;
    }

    Promise.all([updatePosts(currentDailyNote)]);
  }, [currentDailyNote, updatePosts]);

  useEffect(() => {
    const eventRef = app.metadataCache.on(
      "changed",
      async (file, data, cache) => {
        // currentDailyNoteが存在してパスが異なるなら、違う日なので更新は不要
        if (currentDailyNote != null && file.path !== currentDailyNote.path) {
          return;
        }

        if (currentDailyNote == null) {
          const ds = getDailyNoteSettings();
          const dir = ds.folder ? `${ds.folder}/` : "";
          const entry = date.format(ds.format);
          // 更新されたファイルがcurrentDailyNoteになるべきファイルではなければ処理は不要
          if (file.path !== `${dir}${entry}.md`) {
            return;
          }
        }

        // 同期などで裏でDaily Noteが作成されたときに更新する
        updateCurrentDailyNote();
        await Promise.all([updatePosts(file)]);
      },
    );

    const deleteEventRef = app.vault.on("delete", async (file) => {
      // currentDailyNoteとは別のファイルなら関係ない
      if (file.path !== currentDailyNote?.path) {
        return;
      }

      // 再読み込みをするためにクローンを入れて参照を更新
      setDate(date.clone());
      setPosts([]);
    });

    return () => {
      app.metadataCache.offref(eventRef);
      app.vault.offref(deleteEventRef);
    };
  }, [date, currentDailyNote]);

  const handleKeydown = () => {
    if (input) {
      handleClickSubmit();
    }
  };

  useEffect(() => {
    window.addEventListener("postNewTimeLog", handleKeydown);
    return () => {
      window.removeEventListener("postNewTimeLog", handleKeydown);
    };
  }, [input]);

  return (
    <Flex
      flexDirection="column"
      gap="0.75rem"
      height="95%"
      maxWidth="30rem"
      position={"relative"}
    >
      <HStack justify="center">
        <ChevronLeftIcon
          boxSize="1.5em"
          cursor="pointer"
          onClick={handleClickMovePrevious}
        />
        <Box textAlign={"center"}>
          <Button
            marginRight={"0.3em"}
            fontSize={"80%"}
            width="3em"
            height="2em"
            cursor="pointer"
            onClick={handleClickToday}
          >
            今日
          </Button>
          <Input
            size="md"
            type="date"
            value={date.format("YYYY-MM-DD")}
            onChange={handleChangeCalendarDate}
            width={"9em"}
          />
          <Box as="span" marginLeft={"0.2em"} fontSize={"95%"}>
            {replaceDayToJa(date.format("(ddd)"))}
          </Box>
        </Box>
        <ChevronRightIcon
          boxSize="1.5em"
          cursor="pointer"
          onClick={handleClickMoveNext}
        />
      </HStack>
      <Box position="absolute" right={0}>
        <ExternalLinkIcon
          boxSize="1.25em"
          cursor="pointer"
          onClick={handleClickOpenDailyNote}
        />
      </Box>

      <Textarea
        placeholder={"出来事を入力"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        minHeight={"8em"}
        isDisabled={isLoading}
        resize="vertical"
      />
      <HStack>
        <Button
          isDisabled={!canSubmit}
          isLoading={isLoading}
          className={canSubmit ? "mod-cta" : ""}
          minHeight={"2.4em"}
          maxHeight={"2.4em"}
          flexGrow={1}
          cursor={canSubmit ? "pointer" : ""}
          onClick={handleClickSubmit}
        >
          {"投稿"}
        </Button>
      </HStack>
    </Flex>
  );
};
