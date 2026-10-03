"use client";

export default function Error({
    reset,
}: {
    reset: () => void;
}) {
    return (
        <main>
            <p>
                データを取得できませんでした。
            </p>
            <button onClick={() => reset()}>
                再試行
            </button>
        </main>
    );
}