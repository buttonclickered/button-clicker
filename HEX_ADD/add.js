const letters = [
        'a', 'b', 'c', 'd', 'e', 'f',
            'g', 'h', 'i', 'j', 'k', 'l',
                'm', 'n', 'o', 'p', 'q', 'r',
                    's', 't', 'u', 'v', 'w', 'x',
                        'y', 'z'
                        ]

                        let num1 = 0;
                        let num2 = 0;
                        let num3 = 0;
                        let num4 = 0;
                        let num5 = 0;

                        const nums = [num1, num2, num3, num4, num5];

                        for (let i = 0; i < letters.length; i++) {
                            const letter = letters[i];
                                const num = i + 1;
                                    nums[i] = num;
                                        console.log(`${letter}: ${num}`);
                                        }
]